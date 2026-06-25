import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import AdminLoader from '../components/admin/AdminLoader'
import NotFoundPage from '../components/common/NotFoundPage'

const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'))
const AdminChangePassword = lazy(() => import('../pages/admin/AdminChangePassword'))
const SiteSettings = lazy(() => import('../pages/admin/SiteSettings'))
const Dashboard = lazy(() => import('../pages/admin/Dashboard'))
const Users = lazy(() => import('../pages/admin/Users'))
const UserDetails = lazy(() => import('../pages/admin/UserDetails'))
const Staff = lazy(() => import('../pages/admin/Staff'))
const StaffForm = lazy(() => import('../pages/admin/StaffForm'))
const Roles = lazy(() => import('../pages/admin/Roles'))
const RoleForm = lazy(() => import('../pages/admin/RoleForm'))
const Categories = lazy(() => import('../pages/admin/categories/Index'))
const CategoryCreate = lazy(() => import('../pages/admin/categories/Create'))
const CategoryEdit = lazy(() => import('../pages/admin/categories/Edit'))
const Manufacturers = lazy(() => import('../pages/admin/manufacturers/Index'))
const ManufacturerCreate = lazy(() => import('../pages/admin/manufacturers/Create'))
const ManufacturerEdit = lazy(() => import('../pages/admin/manufacturers/Edit'))
const Products = lazy(() => import('../pages/admin/products/Index'))
const ProductCreate = lazy(() => import('../pages/admin/products/Create'))
const ProductEdit = lazy(() => import('../pages/admin/products/Edit'))
const Suppliers = lazy(() => import('../pages/admin/suppliers/Index'))
const SupplierCreate = lazy(() => import('../pages/admin/suppliers/Create'))
const SupplierEdit = lazy(() => import('../pages/admin/suppliers/Edit'))
const Inventory = lazy(() => import('../pages/admin/inventory/Index'))
const InventoryBatches = lazy(() => import('../pages/admin/inventory/batches/Index'))
const InventoryBatchCreate = lazy(() => import('../pages/admin/inventory/batches/Create'))
const InventoryBatchEdit = lazy(() => import('../pages/admin/inventory/batches/Edit'))
const InventoryTransactions = lazy(() => import('../pages/admin/inventory/transactions/Index'))
const LowStock = lazy(() => import('../pages/admin/inventory/LowStock'))
const NearExpiry = lazy(() => import('../pages/admin/inventory/NearExpiry'))
const Prescriptions = lazy(() => import('../pages/admin/Prescriptions'))
const PrescriptionDetails = lazy(() => import('../pages/admin/PrescriptionDetails'))
const Orders = lazy(() => import('../pages/admin/Orders'))
const OrderDetails = lazy(() => import('../pages/admin/OrderDetails'))
const Payments = lazy(() => import('../pages/admin/Payments'))
const PaymentMethods = lazy(() => import('../pages/admin/PaymentMethods'))
const DeliveryAreas = lazy(() => import('../pages/admin/DeliveryAreas'))
const Riders = lazy(() => import('../pages/admin/Riders'))
const Deliveries = lazy(() => import('../pages/admin/Deliveries'))
const DeliveryDetails = lazy(() => import('../pages/admin/DeliveryDetails'))
const SupportTickets = lazy(() => import('../pages/admin/SupportTickets'))
const SupportTicketDetails = lazy(() => import('../pages/admin/SupportTicketDetails'))
const Returns = lazy(() => import('../pages/admin/Returns'))
const Refunds = lazy(() => import('../pages/admin/Refunds'))
const Reports = lazy(() => import('../pages/admin/Reports'))
const ReportDetails = lazy(() => import('../pages/admin/ReportDetails'))
const ActivityLogs = lazy(() => import('../pages/admin/ActivityLogs'))
const AdminNotifications = lazy(() => import('../pages/admin/AdminNotifications'))
const MarketingTools = lazy(() => import('../pages/admin/MarketingTools'))

function AdminRouteFallback() {
  return <AdminLoader />
}

export default function AdminRoutes() {
  return (
    <ProtectedAdminRoute>
      <Suspense fallback={<AdminRouteFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="profile" element={<AdminProfile />} />
            <Route path="profile/password" element={<AdminChangePassword />} />
            <Route path="site-settings" element={<SiteSettings />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="staff" element={<Staff />} />
            <Route path="staff/create" element={<StaffForm />} />
            <Route path="staff/:id/edit" element={<StaffForm />} />
            <Route path="roles" element={<Roles />} />
            <Route path="roles/create" element={<RoleForm />} />
            <Route path="roles/:id/edit" element={<RoleForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/create" element={<CategoryCreate />} />
            <Route path="categories/:id/edit" element={<CategoryEdit />} />
            <Route path="manufacturers" element={<Manufacturers />} />
            <Route path="manufacturers/create" element={<ManufacturerCreate />} />
            <Route path="manufacturers/:id/edit" element={<ManufacturerEdit />} />
            <Route path="products" element={<Products />} />
            <Route path="products/create" element={<ProductCreate />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="coupons" element={<MarketingTools type="coupons" />} />
            <Route path="offers" element={<MarketingTools type="offers" />} />
            <Route path="popups" element={<MarketingTools type="popups" />} />
            <Route path="hero-images" element={<MarketingTools type="heroImages" />} />
            <Route path="banner-images" element={<MarketingTools type="bannerImages" />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/create" element={<SupplierCreate />} />
            <Route path="suppliers/:id/edit" element={<SupplierEdit />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/batches" element={<InventoryBatches />} />
            <Route path="inventory/batches/create" element={<InventoryBatchCreate />} />
            <Route path="inventory/batches/:id/edit" element={<InventoryBatchEdit />} />
            <Route path="inventory/transactions" element={<InventoryTransactions />} />
            <Route path="inventory/low-stock" element={<LowStock />} />
            <Route path="inventory/near-expiry" element={<NearExpiry />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="prescriptions/:id" element={<PrescriptionDetails />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="delivery-areas" element={<DeliveryAreas />} />
            <Route path="riders" element={<Riders />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="deliveries/:id" element={<DeliveryDetails />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="support/:id" element={<SupportTicketDetails />} />
            <Route path="returns" element={<Returns />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:type" element={<ReportDetails />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
          <Route
            path="*"
            element={(
              <NotFoundPage
                
                actionLabel="Back to dashboard"
                actionTo="/admin/dashboard"
              />
            )}
          />
        </Routes>
      </Suspense>
    </ProtectedAdminRoute>
  )
}
