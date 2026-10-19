import { redirect } from 'next/navigation'

// ERP nemá veřejný web – úvodní adresa vede rovnou do administrace.
export default function HomePage() {
  redirect('/admin')
}
