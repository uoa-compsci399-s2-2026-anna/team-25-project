import { Heading } from "@repo/ui/components/ui"
import { RegisterDetailsForm, RegisterStepper } from "@/features/auth/components"
import { getInstitutions } from "@/features/institutions/queries"

export default async function Page() {
  const institutions = await getInstitutions()

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-16">
      <RegisterStepper current={1} />

      <div className="flex flex-col gap-3 text-center">
        <Heading level="h1">Join CCCA</Heading>
        <p className="text-muted-foreground">
          Free for academics teaching or researching computing capstones at an Australian or New
          Zealand university.
        </p>
      </div>

      <RegisterDetailsForm institutions={institutions} />
    </main>
  )
}
