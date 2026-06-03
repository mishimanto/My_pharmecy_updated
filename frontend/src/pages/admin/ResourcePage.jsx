import AdminTable from '../../components/admin/AdminTable'
import PageHeader from '../../components/common/PageHeader'

export default function ResourcePage({ title, resource }) {
  return <><PageHeader title={title} subtitle="সার্চ, পেজিনেশন এবং রেকর্ড ম্যানেজ করুন।" /><AdminTable resource={resource} /></>
}
