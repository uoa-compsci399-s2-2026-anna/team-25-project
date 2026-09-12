"use client"

import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
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
    <div className="my-[10vh] flex h-[60vh] w-[70vw] flex-col">
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-center">
          <h1 className="font-extrabold text-6xl">Welcome Back</h1>
          <h6 className="text-lg text-muted-foreground">
            Log in to see proposals, course data and member contact details.
          </h6>
        </div>

        <div className="my-8">
          <form
            className="w-full"
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
                      <FieldLabel className="font-extrabold text-lg" htmlFor={field.name}>
                        University Email
                      </FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="email"
                        className="h-13 gap-1.5 rounded-md px-3.5"
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
                      <div className="flex flex-row justify-between font-extrabold">
                        <FieldLabel className="font-extrabold text-lg" htmlFor={field.name}>
                          Password
                        </FieldLabel>
                        <Link className="text-brand-mauve hover:text-primary" href="/">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative w-full">
                        <Input
                          aria-invalid={isInvalid}
                          autoComplete="current-password"
                          className="h-13 w-full gap-1.5 rounded-md px-3.5"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          value={field.state.value}
                        />
                        <button
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-sm hover:text-primary"
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

            <div className="my-8">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    size="xxl"
                    type="submit"
                    variant="button-mauve"
                  >
                    Log in
                  </Button>
                )}
              </form.Subscribe>
              <div className="mt-4">
                <Link className="text-muted-foreground text-sm" href="/">
                  New here?{" "}
                  <span className="text-brand-mauve underline">Register with your uni email</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
