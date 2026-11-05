export type ProductContext = { problemSolved: string; targetAudience: string; differentiators: string; keywords: string; restrictions: string }
export type Product = {
  id: string; tenantId: string; name: string; description: string; category: string; productVersion: string
  status: string; createdAt: string; context: ProductContext; version: number
}
export const emptyProductContext: ProductContext = { problemSolved: '', targetAudience: '', differentiators: '', keywords: '', restrictions: '' }
