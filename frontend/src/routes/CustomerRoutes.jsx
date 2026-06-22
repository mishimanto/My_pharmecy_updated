import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import CustomerLayout from '../layouts/CustomerLayout'
import ProtectedCustomerRoute from './ProtectedCustomerRoute'

const Home = lazy(() => import('../pages/customer/Home'))
const Products = lazy(() => import('../pages/customer/Products'))
const ProductDetails = lazy(() => import('../pages/customer/ProductDetails'))
const Offers = lazy(() => import('../pages/customer/Offers'))
const Cart = lazy(() => import('../pages/customer/Cart'))
const Checkout = lazy(() => import('../pages/customer/Checkout'))
const TrackOrder = lazy(() => import('../pages/customer/TrackOrder'))
const Wishlist = lazy(() => import('../pages/customer/Wishlist'))
const Account = lazy(() => import('../pages/customer/Account'))
const Addresses = lazy(() => import('../pages/customer/Addresses'))
const MyOrders = lazy(() => import('../pages/customer/MyOrders'))
const OrderDetails = lazy(() => import('../pages/customer/OrderDetails'))
const OrderPayment = lazy(() => import('../pages/customer/OrderPayment'))
const Tracking = lazy(() => import('../pages/customer/Tracking'))
const Prescriptions = lazy(() => import('../pages/customer/Prescriptions'))
const PrescriptionDetails = lazy(() => import('../pages/customer/PrescriptionDetails'))
const Rewards = lazy(() => import('../pages/customer/Rewards'))
const UploadPrescription = lazy(() => import('../pages/customer/UploadPrescription'))
const Support = lazy(() => import('../pages/customer/Support'))
const SupportDetails = lazy(() => import('../pages/customer/SupportDetails'))
const Returns = lazy(() => import('../pages/customer/Returns'))
const ReturnDetails = lazy(() => import('../pages/customer/ReturnDetails'))
const Notifications = lazy(() => import('../pages/customer/Notifications'))
const Faq = lazy(() => import('../pages/customer/Faq'))
const PrivacyPolicy = lazy(() => import('../pages/customer/PrivacyPolicy'))
const TermsConditions = lazy(() => import('../pages/customer/TermsConditions'))
const RefundPolicy = lazy(() => import('../pages/customer/RefundPolicy'))

function CustomerRouteFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 text-sm font-semibold text-slate-500">
      Loading...
    </div>
  )
}

export default function CustomerRoutes() {
  return (
    <Suspense fallback={<CustomerRouteFallback />}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetails />} />
          <Route path="offers" element={<Offers />} />
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
          <Route path="prescriptions/:id" element={<ProtectedCustomerRoute><PrescriptionDetails /></ProtectedCustomerRoute>} />
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
    </Suspense>
  )
}
