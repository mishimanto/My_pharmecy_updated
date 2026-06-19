import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import AdminProfile from '../pages/admin/AdminProfile'
import AdminChangePassword from '../pages/admin/AdminChangePassword'
import SiteSettings from '../pages/admin/SiteSettings'
import Dashboard from '../pages/admin/Dashboard'
import Users from '../pages/admin/Users'
import UserDetails from '../pages/admin/UserDetails'
import Staff from '../pages/admin/Staff'
import StaffForm from '../pages/admin/StaffForm'
import Roles from '../pages/admin/Roles'
import RoleForm from '../pages/admin/RoleForm'
import Categories from '../pages/admin/categories/Index'
import CategoryCreate from '../pages/admin/categories/Create'
import CategoryEdit from '../pages/admin/categories/Edit'
import Manufacturers from '../pages/admin/manufacturers/Index'
import ManufacturerCreate from '../pages/admin/manufacturers/Create'
import ManufacturerEdit from '../pages/admin/manufacturers/Edit'
import Products from '../pages/admin/products/Index'
import ProductCreate from '../pages/admin/products/Create'
import ProductEdit from '../pages/admin/products/Edit'
import Suppliers from '../pages/admin/suppliers/Index'
import SupplierCreate from '../pages/admin/suppliers/Create'
import SupplierEdit from '../pages/admin/suppliers/Edit'
import Inventory from '../pages/admin/inventory/Index'
import InventoryBatches from '../pages/admin/inventory/batches/Index'
import InventoryBatchCreate from '../pages/admin/inventory/batches/Create'
import InventoryBatchEdit from '../pages/admin/inventory/batches/Edit'
import InventoryTransactions from '../pages/admin/inventory/transactions/Index'
import LowStock from '../pages/admin/inventory/LowStock'
import NearExpiry from '../pages/admin/inventory/NearExpiry'
import Prescriptions from '../pages/admin/Prescriptions'
import PrescriptionDetails from '../pages/admin/PrescriptionDetails'
import Orders from '../pages/admin/Orders'
import OrderDetails from '../pages/admin/OrderDetails'
import Payments from '../pages/admin/Payments'
import DeliveryAreas from '../pages/admin/DeliveryAreas'
import Riders from '../pages/admin/Riders'
import Deliveries from '../pages/admin/Deliveries'
import DeliveryDetails from '../pages/admin/DeliveryDetails'
import SupportTickets from '../pages/admin/SupportTickets'
import SupportTicketDetails from '../pages/admin/SupportTicketDetails'
import Returns from '../pages/admin/Returns'
import Refunds from '../pages/admin/Refunds'
import Reports from '../pages/admin/Reports'
import ReportDetails from '../pages/admin/ReportDetails'
import ActivityLogs from '../pages/admin/ActivityLogs'

export default function AdminRoutes() {
  return (
    <ProtectedAdminRoute>
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
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </ProtectedAdminRoute>
  )
}
