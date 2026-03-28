'use server'

export async function submitContactForm(
  _prev: { success: boolean; error: string },
  formData: FormData
) {
  const name = formData.get('name')
  const email = formData.get('email')
  const message = formData.get('message')

  if (!name || !email || !message) {
    return { success: false, error: 'All fields are required.' }
  }

  return { success: true, error: '' }
}
