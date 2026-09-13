"use client"

import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Heading,
  Input,
  toast,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import type { z } from "zod"
import { loginAction } from "@/features/auth/actions/auth"
import { loginFormSchema } from "@/features/auth/zod/loginFormSchema"
import { Routes } from "@/lib/routes"

function validateOnBlur(schema: z.ZodType<string>) {
  return ({ value }: { value: string }) => {
    if (!value) return undefined
    const result = schema.safeParse(value)
    return result.success ? undefined : { message: result.error.issues[0]?.message }
  }
}

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginFormSchema,
    },
    onSubmit: async (values) => {
      const result = await loginAction(values.value.email, values.value.password)
      if (result.success) {
        router.refresh()
        router.push(Routes.HOME)
      } else {
        toast.add({
          title: "Login failed",
          description: result.message,
        })
      }
    },
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 text-center">
        <Heading level="h1">Welcome Back</Heading>
        <p className="text-muted-foreground">
          Log in to see proposals, course data and member contact details.
        </p>
      </div>

      <form
        className="flex flex-col gap-8"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <form.Field
            name="email"
            validators={{ onBlur: validateOnBlur(loginFormSchema.shape.email) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>University email</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="email"
                    className="h-10"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="email"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onBlur: validateOnBlur(loginFormSchema.shape.password) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex flex-row items-center justify-between">
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Link className="text-primary text-sm underline underline-offset-4" href="/">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative w-full">
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="current-password"
                      className="h-10 w-full pr-16"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-sm hover:text-primary"
                      onClick={() => setShowPassword((value) => !value)}
                      type="button"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        </FieldGroup>

        <div className="flex flex-col gap-4">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                className="w-full"
                disabled={isSubmitting}
                size="xl"
                type="submit"
                variant="button-mauve"
              >
                Log in
              </Button>
            )}
          </form.Subscribe>
          <Link className="text-muted-foreground text-sm" href={Routes.REGISTER.ROOT}>
            New here?{" "}
            <span className="text-primary underline underline-offset-4">
              Register with your uni email
            </span>
          </Link>
        </div>
      </form>
    </div>
  )
}
