import AdminTable from '../../components/admin/AdminTable'
import PageHeader from '../../components/common/PageHeader'

export default function ResourcePage({ title, resource }) {
  return <><PageHeader title={title} subtitle="Search, paginate, and manage records." /><AdminTable resource={resource} /></>
}
