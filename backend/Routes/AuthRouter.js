const { AdminLogin, StudentLogin, AdminRegister, StudentRegister, FacultyLogin, FacultyRegister } = require('../Controllers/AuthController');
const { AdminLoginValidation, StudentLoginValidation, AdminRegisterationValidation, StudentRegisterationValidation, FacultyLoginValidation, FacultyRegisterationValidation } = require('../Middlewares/AuthValidation');

const router = require('express').Router();

router.post('/AdminLogin', AdminLoginValidation, AdminLogin);
router.post('/AdminRegister', AdminRegisterationValidation, AdminRegister);

router.post('/StudentLogin', StudentLoginValidation, StudentLogin);
router.post('/StudentRegister', StudentRegisterationValidation, StudentRegister);

router.post('/FacultyLogin', FacultyLoginValidation, FacultyLogin);
router.post('/FacultyRegister', FacultyRegisterationValidation, FacultyRegister);

module.exports = router;
