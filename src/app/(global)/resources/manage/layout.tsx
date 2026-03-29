interface ResourceManageLayoutProps {
  children: React.ReactNode
}

export default function ResourceManageLayout({ children }: ResourceManageLayoutProps) {
  return <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">{children}</div>
}
