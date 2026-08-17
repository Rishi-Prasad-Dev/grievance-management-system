const express = require('express');
const FeedbackModel = require('../Models/Feedback');
const ComplainModel = require('../Models/Complain');
const router = express.Router();

// Create feedback request (Admin/Faculty trigger when complaint is finalized)
router.post('/create-request', async (req, res) => {
  try {
    const { complaintId } = req.body;
    if (!complaintId) {
      return res.status(400).json({ error: 'complaintId is required' });
    }

    const complaint = await ComplainModel.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check if complaint status is eligible for feedback
    const finalStatuses = ['Resolved', 'Closed', 'Rejected'];
    if (!finalStatuses.includes(complaint.status)) {
      return res.status(400).json({
        error: `Feedback can only be requested for complaints with status: ${finalStatuses.join(', ')}`
      });
    }

    // Check if feedback request already exists
    const existing = await FeedbackModel.findOne({ complaintId });
    if (existing) {
      return res.status(400).json({ error: 'Feedback request already exists for this complaint' });
    }

    const feedback = new FeedbackModel({
      complaintId: complaint._id,
      studentId: complaint.UserName,
      studentName: complaint.Name
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: `Feedback request created for ${complaint.status.toLowerCase()} complaint`,
      feedbackId: feedback._id
    });

  } catch (error) {
    console.error('Create feedback request error:', error);
    res.status(500).json({ error: 'Server error creating feedback request' });
  }
});

// Get feedback requests for student (pending only)
router.get('/student/:studentId', async (req, res) => {
  try {
    const requests = await FeedbackModel.find({
      studentId: req.params.studentId,
      isSubmitted: false
    }).populate('complaintId').sort({ createdAt: -1 });

    // Filter out requests where complaint might have been deleted
    const validRequests = requests.filter(req => req.complaintId);
    res.json(validRequests);

  } catch (error) {
    console.error('Get student feedback requests error:', error);
    res.status(500).json({ error: 'Server error fetching feedback requests' });
  }
});

// Get all feedback requests for a specific complaint
router.get('/complaint/:complaintId', async (req, res) => {
  try {
    const requests = await FeedbackModel.find({
      complaintId: req.params.complaintId
    }).populate('complaintId').sort({ createdAt: -1 });

    res.json(requests);

  } catch (error) {
    console.error('Get complaint feedback requests error:', error);
    res.status(500).json({ error: 'Server error fetching complaint feedback' });
  }
});

// Student submits feedback
router.patch('/submit/:id', async (req, res) => {
  try {
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    const feedback = await FeedbackModel.findByIdAndUpdate(
      req.params.id,
      {
        rating: parseInt(rating),
        comments: comments || '',
        isSubmitted: true,
        submittedDate: new Date()
      },
      { new: true }
    ).populate('complaintId');

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback request not found' });
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        comments: feedback.comments,
        complaintTitle: feedback.complaintId?.ComplaintTitle
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

// Get all submitted feedback (Admin/Faculty)
router.get('/all', async (req, res) => {
  try {
    const feedbacks = await FeedbackModel.find({ isSubmitted: true })
      .populate({
        path: 'complaintId',
        populate: {
          path: 'lastUpdatedBy',
          select: 'name email'
        }
      })
      .sort({ submittedDate: -1 });

    // Filter out feedbacks where complaint might have been deleted
    const validFeedbacks = feedbacks.filter(feedback => feedback.complaintId);
    res.json(validFeedbacks);

  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ error: 'Server error fetching all feedback' });
  }
});

// Get feedback statistics (General)
router.get('/stats', async (req, res) => {
  try {
    const stats = await FeedbackModel.aggregate([
      { $match: { isSubmitted: true } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    const result = stats[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    res.json({
      totalFeedbacks: result.totalFeedbacks,
      averageRating: Math.round(result.averageRating * 100) / 100,
      ratingDistribution: distribution
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ error: 'Server error fetching feedback statistics' });
  }
});

// NEW: Get feedback statistics for specific faculty member
router.get('/stats/faculty/:facultyId', async (req, res) => {
  try {
    const facultyId = req.params.facultyId;

    // Find all complaints handled by this faculty member
    const complaints = await ComplainModel.find({
      lastUpdatedBy: facultyId,
      status: { $in: ['Resolved', 'Closed', 'Rejected'] }
    }).select('_id');

    const complaintIds = complaints.map(c => c._id);

    if (complaintIds.length === 0) {
      return res.json({
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        complaintsHandled: 0
      });
    }

    // Get feedback for these complaints
    const stats = await FeedbackModel.aggregate([
      { 
        $match: { 
          isSubmitted: true,
          complaintId: { $in: complaintIds }
        } 
      },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        complaintsHandled: complaintIds.length
      });
    }

    const result = stats[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    res.json({
      totalFeedbacks: result.totalFeedbacks,
      averageRating: Math.round(result.averageRating * 100) / 100,
      ratingDistribution: distribution,
      complaintsHandled: complaintIds.length
    });

  } catch (error) {
    console.error('Get faculty feedback stats error:', error);
    res.status(500).json({ error: 'Server error fetching faculty feedback statistics' });
  }
});

// Delete feedback request (Admin only - for cleanup)
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await FeedbackModel.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback request not found' });
    }

    res.json({
      success: true,
      message: 'Feedback request deleted successfully'
    });

  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Server error deleting feedback request' });
  }
});

module.exports = router;