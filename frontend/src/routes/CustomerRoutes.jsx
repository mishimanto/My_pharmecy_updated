import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import NotFoundPage from '../components/common/NotFoundPage'
import CustomerLayout from '../layouts/CustomerLayout'
import ProtectedCustomerRoute from './ProtectedCustomerRoute'

function lazyWithLoader(importer) {
  return lazy(importer)
}

const Home = lazyWithLoader(() => import('../pages/customer/Home'))
const Products = lazyWithLoader(() => import('../pages/customer/Products'))
const ProductDetails = lazyWithLoader(() => import('../pages/customer/ProductDetails'))
const Offers = lazyWithLoader(() => import('../pages/customer/Offers'))
const Cart = lazyWithLoader(() => import('../pages/customer/Cart'))
const Checkout = lazyWithLoader(() => import('../pages/customer/Checkout'))
const TrackOrder = lazyWithLoader(() => import('../pages/customer/TrackOrder'))
const Wishlist = lazyWithLoader(() => import('../pages/customer/Wishlist'))
const Account = lazyWithLoader(() => import('../pages/customer/Account'))
const Addresses = lazyWithLoader(() => import('../pages/customer/Addresses'))
const MyOrders = lazyWithLoader(() => import('../pages/customer/MyOrders'))
const OrderDetails = lazyWithLoader(() => import('../pages/customer/OrderDetails'))
const OrderPayment = lazyWithLoader(() => import('../pages/customer/OrderPayment'))
const Tracking = lazyWithLoader(() => import('../pages/customer/Tracking'))
const Prescriptions = lazyWithLoader(() => import('../pages/customer/Prescriptions'))
const PrescriptionDetails = lazyWithLoader(() => import('../pages/customer/PrescriptionDetails'))
const Rewards = lazyWithLoader(() => import('../pages/customer/Rewards'))
const UploadPrescription = lazyWithLoader(() => import('../pages/customer/UploadPrescription'))
const Support = lazyWithLoader(() => import('../pages/customer/Support'))
const SupportDetails = lazyWithLoader(() => import('../pages/customer/SupportDetails'))
const Returns = lazyWithLoader(() => import('../pages/customer/Returns'))
const ReturnDetails = lazyWithLoader(() => import('../pages/customer/ReturnDetails'))
const Notifications = lazyWithLoader(() => import('../pages/customer/Notifications'))
const Faq = lazyWithLoader(() => import('../pages/customer/Faq'))
const PrivacyPolicy = lazyWithLoader(() => import('../pages/customer/PrivacyPolicy'))
const TermsConditions = lazyWithLoader(() => import('../pages/customer/TermsConditions'))
const RefundPolicy = lazyWithLoader(() => import('../pages/customer/RefundPolicy'))

export default function CustomerRoutes() {
  return (
    <Suspense fallback={null}>
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
        </Route>
        <Route
          path="*"
          element={(
            <NotFoundPage
              
              actionLabel="Back to home"
              actionTo="/"
            />
          )}
        />
      </Routes>
    </Suspense>
  )
}
