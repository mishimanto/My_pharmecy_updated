import { Navigate, Route, Routes } from 'react-router-dom'
import CustomerLayout from '../layouts/CustomerLayout'
import ProtectedCustomerRoute from './ProtectedCustomerRoute'
import Home from '../pages/customer/Home'
import Products from '../pages/customer/Products'
import ProductDetails from '../pages/customer/ProductDetails'
import Cart from '../pages/customer/Cart'
import Checkout from '../pages/customer/Checkout'
import TrackOrder from '../pages/customer/TrackOrder'
import Wishlist from '../pages/customer/Wishlist'
import Account from '../pages/customer/Account'
import Addresses from '../pages/customer/Addresses'
import MyOrders from '../pages/customer/MyOrders'
import OrderDetails from '../pages/customer/OrderDetails'
import OrderPayment from '../pages/customer/OrderPayment'
import Tracking from '../pages/customer/Tracking'
import Prescriptions from '../pages/customer/Prescriptions'
import Rewards from '../pages/customer/Rewards'
import UploadPrescription from '../pages/customer/UploadPrescription'
import Support from '../pages/customer/Support'
import SupportDetails from '../pages/customer/SupportDetails'
import Returns from '../pages/customer/Returns'
import ReturnDetails from '../pages/customer/ReturnDetails'
import Notifications from '../pages/customer/Notifications'
import Faq from '../pages/customer/Faq'
import PrivacyPolicy from '../pages/customer/PrivacyPolicy'
import TermsConditions from '../pages/customer/TermsConditions'
import RefundPolicy from '../pages/customer/RefundPolicy'

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductDetails />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="track-order" element={<TrackOrder />} />
        <Route path="account" element={<ProtectedCustomerRoute><Account /></ProtectedCustomerRoute>} />
        <Route path="addresses" element={<ProtectedCustomerRoute><Addresses /></ProtectedCustomerRoute>} />
        <Route path="orders" element={<ProtectedCustomerRoute><MyOrders /></ProtectedCustomerRoute>} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="orders/:id/payment" element={<OrderPayment />} />
        <Route path="orders/:id/tracking" element={<Tracking />} />
        <Route path="prescriptions" element={<ProtectedCustomerRoute><Prescriptions /></ProtectedCustomerRoute>} />
        <Route path="rewards" element={<ProtectedCustomerRoute><Rewards /></ProtectedCustomerRoute>} />
        <Route path="upload-prescription" element={<ProtectedCustomerRoute><UploadPrescription /></ProtectedCustomerRoute>} />
        <Route path="support" element={<ProtectedCustomerRoute><Support /></ProtectedCustomerRoute>} />
        <Route path="support/:reference" element={<ProtectedCustomerRoute><SupportDetails /></ProtectedCustomerRoute>} />
        <Route path="returns" element={<ProtectedCustomerRoute><Returns /></ProtectedCustomerRoute>} />
        <Route path="returns/:id" element={<ProtectedCustomerRoute><ReturnDetails /></ProtectedCustomerRoute>} />
        <Route path="notifications" element={<ProtectedCustomerRoute><Notifications /></ProtectedCustomerRoute>} />
        <Route path="faq" element={<Faq />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-and-conditions" element={<TermsConditions />} />
        <Route path="refund-and-return-policy" element={<RefundPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
