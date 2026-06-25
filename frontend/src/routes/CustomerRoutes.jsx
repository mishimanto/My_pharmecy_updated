import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import NotFoundPage from '../components/common/NotFoundPage'
import CustomerLoader from '../components/customer/CustomerLoader'
import CustomerLayout from '../layouts/CustomerLayout'
import ProtectedCustomerRoute from './ProtectedCustomerRoute'

const ROUTE_LOADER_MIN_DURATION = 1500

function lazyWithMinimumDelay(importer, delay = ROUTE_LOADER_MIN_DURATION) {
  return lazy(() =>
    Promise.all([
      importer(),
      new Promise((resolve) => window.setTimeout(resolve, delay)),
    ]).then(([module]) => module),
  )
}

const Home = lazyWithMinimumDelay(() => import('../pages/customer/Home'))
const Products = lazyWithMinimumDelay(() => import('../pages/customer/Products'))
const ProductDetails = lazyWithMinimumDelay(() => import('../pages/customer/ProductDetails'))
const Offers = lazyWithMinimumDelay(() => import('../pages/customer/Offers'))
const Cart = lazyWithMinimumDelay(() => import('../pages/customer/Cart'))
const Checkout = lazyWithMinimumDelay(() => import('../pages/customer/Checkout'))
const TrackOrder = lazyWithMinimumDelay(() => import('../pages/customer/TrackOrder'))
const Wishlist = lazyWithMinimumDelay(() => import('../pages/customer/Wishlist'))
const Account = lazyWithMinimumDelay(() => import('../pages/customer/Account'))
const Addresses = lazyWithMinimumDelay(() => import('../pages/customer/Addresses'))
const MyOrders = lazyWithMinimumDelay(() => import('../pages/customer/MyOrders'))
const OrderDetails = lazyWithMinimumDelay(() => import('../pages/customer/OrderDetails'))
const OrderPayment = lazyWithMinimumDelay(() => import('../pages/customer/OrderPayment'))
const Tracking = lazyWithMinimumDelay(() => import('../pages/customer/Tracking'))
const Prescriptions = lazyWithMinimumDelay(() => import('../pages/customer/Prescriptions'))
const PrescriptionDetails = lazyWithMinimumDelay(() => import('../pages/customer/PrescriptionDetails'))
const Rewards = lazyWithMinimumDelay(() => import('../pages/customer/Rewards'))
const UploadPrescription = lazyWithMinimumDelay(() => import('../pages/customer/UploadPrescription'))
const Support = lazyWithMinimumDelay(() => import('../pages/customer/Support'))
const SupportDetails = lazyWithMinimumDelay(() => import('../pages/customer/SupportDetails'))
const Returns = lazyWithMinimumDelay(() => import('../pages/customer/Returns'))
const ReturnDetails = lazyWithMinimumDelay(() => import('../pages/customer/ReturnDetails'))
const Notifications = lazyWithMinimumDelay(() => import('../pages/customer/Notifications'))
const Faq = lazyWithMinimumDelay(() => import('../pages/customer/Faq'))
const PrivacyPolicy = lazyWithMinimumDelay(() => import('../pages/customer/PrivacyPolicy'))
const TermsConditions = lazyWithMinimumDelay(() => import('../pages/customer/TermsConditions'))
const RefundPolicy = lazyWithMinimumDelay(() => import('../pages/customer/RefundPolicy'))

function CustomerRouteFallback() {
  return <CustomerLoader />
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
