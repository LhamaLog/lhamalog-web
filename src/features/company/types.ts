export type Company = {
  id: string
  clerkOrgId: string
  version: number | null
  data: { legalName: string; tradeName: string; document: string; registrationDate: string | null; size: string }
  context: { sector: string; mission: string; targetAudience: string; differentiators: string; language: string }
  address: { street: string; number: string; complement: string; district: string; city: string; state: string; country: string; postalCode: string }
}
