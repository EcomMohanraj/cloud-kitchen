import { Router } from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  updateProfile,
} from '../controllers/addressController';

const router = Router();

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/profile', updateProfile);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

export default router;
