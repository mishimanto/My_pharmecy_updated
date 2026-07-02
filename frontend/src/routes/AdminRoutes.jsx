import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import AdminLoader from '../components/admin/AdminLoader'
import NotFoundPage from '../components/common/NotFoundPage'
import { SiteSettingsProvider } from '../context/SiteSettingsContext'

const ROUTE_LOADER_DELAY = 2000

function lazyWithLoader(importer) {
  return lazy(() => Promise.all([
    importer(),
    new Promise((resolve) => globalThis.setTimeout(resolve, ROUTE_LOADER_DELAY)),
  ]).then(([module]) => module))
}

const AdminProfile = lazyWithLoader(() => import('../pages/admin/AdminProfile'))
const AdminChangePassword = lazyWithLoader(() => import('../pages/admin/AdminChangePassword'))
const SiteSettings = lazyWithLoader(() => import('../pages/admin/SiteSettings'))
const Dashboard = lazyWithLoader(() => import('../pages/admin/Dashboard'))
const Users = lazyWithLoader(() => import('../pages/admin/Users'))
const UserDetails = lazyWithLoader(() => import('../pages/admin/UserDetails'))
const Staff = lazyWithLoader(() => import('../pages/admin/Staff'))
const StaffForm = lazyWithLoader(() => import('../pages/admin/StaffForm'))
const Roles = lazyWithLoader(() => import('../pages/admin/Roles'))
const RoleForm = lazyWithLoader(() => import('../pages/admin/RoleForm'))
const Categories = lazyWithLoader(() => import('../pages/admin/categories/Index'))
const CategoryCreate = lazyWithLoader(() => import('../pages/admin/categories/Create'))
const CategoryEdit = lazyWithLoader(() => import('../pages/admin/categories/Edit'))
const Manufacturers = lazyWithLoader(() => import('../pages/admin/manufacturers/Index'))
const ManufacturerCreate = lazyWithLoader(() => import('../pages/admin/manufacturers/Create'))
const ManufacturerEdit = lazyWithLoader(() => import('../pages/admin/manufacturers/Edit'))
const Products = lazyWithLoader(() => import('../pages/admin/products/Index'))
const ProductCreate = lazyWithLoader(() => import('../pages/admin/products/Create'))
const ProductEdit = lazyWithLoader(() => import('../pages/admin/products/Edit'))
const Suppliers = lazyWithLoader(() => import('../pages/admin/suppliers/Index'))
const SupplierCreate = lazyWithLoader(() => import('../pages/admin/suppliers/Create'))
const SupplierEdit = lazyWithLoader(() => import('../pages/admin/suppliers/Edit'))
const Inventory = lazyWithLoader(() => import('../pages/admin/inventory/Index'))
const InventoryBatches = lazyWithLoader(() => import('../pages/admin/inventory/batches/Index'))
const InventoryBatchCreate = lazyWithLoader(() => import('../pages/admin/inventory/batches/Create'))
const InventoryBatchEdit = lazyWithLoader(() => import('../pages/admin/inventory/batches/Edit'))
const StockAdjustments = lazyWithLoader(() => import('../pages/admin/inventory/StockAdjustments'))
const InventoryTransactions = lazyWithLoader(() => import('../pages/admin/inventory/transactions/Index'))
const LowStock = lazyWithLoader(() => import('../pages/admin/inventory/LowStock'))
const NearExpiry = lazyWithLoader(() => import('../pages/admin/inventory/NearExpiry'))
const Prescriptions = lazyWithLoader(() => import('../pages/admin/Prescriptions'))
const PrescriptionDetails = lazyWithLoader(() => import('../pages/admin/PrescriptionDetails'))
const Orders = lazyWithLoader(() => import('../pages/admin/Orders'))
const OrderDetails = lazyWithLoader(() => import('../pages/admin/OrderDetails'))
const Payments = lazyWithLoader(() => import('../pages/admin/Payments'))
const PaymentMethods = lazyWithLoader(() => import('../pages/admin/PaymentMethods'))
const DeliveryAreas = lazyWithLoader(() => import('../pages/admin/DeliveryAreas'))
const Riders = lazyWithLoader(() => import('../pages/admin/Riders'))
const Deliveries = lazyWithLoader(() => import('../pages/admin/Deliveries'))
const DeliveryDetails = lazyWithLoader(() => import('../pages/admin/DeliveryDetails'))
const SupportTickets = lazyWithLoader(() => import('../pages/admin/SupportTickets'))
const SupportTicketDetails = lazyWithLoader(() => import('../pages/admin/SupportTicketDetails'))
const Returns = lazyWithLoader(() => import('../pages/admin/Returns'))
const Refunds = lazyWithLoader(() => import('../pages/admin/Refunds'))
const Reports = lazyWithLoader(() => import('../pages/admin/Reports'))
const ReportDetails = lazyWithLoader(() => import('../pages/admin/ReportDetails'))
const ActivityLogs = lazyWithLoader(() => import('../pages/admin/ActivityLogs'))
const Security = lazyWithLoader(() => import('../pages/admin/Security'))
const AiCenter = lazyWithLoader(() => import('../pages/admin/AiCenter'))
const AdminNotifications = lazyWithLoader(() => import('../pages/admin/AdminNotifications'))
const MarketingTools = lazyWithLoader(() => import('../pages/admin/MarketingTools'))

function AdminRouteFallback() {
  return <AdminLoader transition />
}

export default function AdminRoutes() {
  return (
    <ProtectedAdminRoute>
      <Suspense fallback={<AdminRouteFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="profile" element={<AdminProfile />} />
            <Route path="profile/password" element={<AdminChangePassword />} />
            <Route path="site-settings" element={<SiteSettingsProvider><SiteSettings /></SiteSettingsProvider>} />
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
            <Route path="inventory/stock-adjustments" element={<StockAdjustments />} />
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
            <Route path="security" element={<Security />} />
            <Route path="ai" element={<AiCenter />} />
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
