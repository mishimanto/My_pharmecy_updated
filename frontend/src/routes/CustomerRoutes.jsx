import { Navigate, Route, Routes } from 'react-router-dom'
import CustomerLayout from '../layouts/CustomerLayout'
import ProtectedCustomerRoute from './ProtectedCustomerRoute'
import Home from '../pages/customer/Home'
import Products from '../pages/customer/Products'
import ProductDetails from '../pages/customer/ProductDetails'
import Cart from '../pages/customer/Cart'
import Checkout from '../pages/customer/Checkout'
import MyOrders from '../pages/customer/MyOrders'
import OrderDetails from '../pages/customer/OrderDetails'
import Tracking from '../pages/customer/Tracking'
import Prescriptions from '../pages/customer/Prescriptions'
import UploadPrescription from '../pages/customer/UploadPrescription'
import Support from '../pages/customer/Support'
import SupportDetails from '../pages/customer/SupportDetails'
import Returns from '../pages/customer/Returns'
import ReturnDetails from '../pages/customer/ReturnDetails'
import Notifications from '../pages/customer/Notifications'

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="cart" element={<ProtectedCustomerRoute><Cart /></ProtectedCustomerRoute>} />
        <Route path="checkout" element={<ProtectedCustomerRoute><Checkout /></ProtectedCustomerRoute>} />
        <Route path="orders" element={<ProtectedCustomerRoute><MyOrders /></ProtectedCustomerRoute>} />
        <Route path="orders/:id" element={<ProtectedCustomerRoute><OrderDetails /></ProtectedCustomerRoute>} />
        <Route path="orders/:id/tracking" element={<ProtectedCustomerRoute><Tracking /></ProtectedCustomerRoute>} />
        <Route path="prescriptions" element={<ProtectedCustomerRoute><Prescriptions /></ProtectedCustomerRoute>} />
        <Route path="upload-prescription" element={<ProtectedCustomerRoute><UploadPrescription /></ProtectedCustomerRoute>} />
        <Route path="support" element={<ProtectedCustomerRoute><Support /></ProtectedCustomerRoute>} />
        <Route path="support/:id" element={<ProtectedCustomerRoute><SupportDetails /></ProtectedCustomerRoute>} />
        <Route path="returns" element={<ProtectedCustomerRoute><Returns /></ProtectedCustomerRoute>} />
        <Route path="returns/:id" element={<ProtectedCustomerRoute><ReturnDetails /></ProtectedCustomerRoute>} />
        <Route path="notifications" element={<ProtectedCustomerRoute><Notifications /></ProtectedCustomerRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
