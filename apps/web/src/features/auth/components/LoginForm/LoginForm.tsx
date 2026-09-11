"use client"

import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Toaster,
  toast,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { redirect } from "next/dist/client/components/redirect"
import Link from "next/link"
import * as React from "react"
import z from "zod"
import { loginAction } from "./actions/auth"

const formSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
})

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: formSchema,
      onBlur: formSchema,
    },
    onSubmit: async (values) => {
      const result = await loginAction(values.value.email, values.value.password)
      if (result.success) {
        redirect("/")
      } else {
        toast.add({
          title: "Login failed",
          description: result.message,
        })
      }
    },
  })

  return (
    <Toaster>
      <div className="my-[10vh] flex h-[60vh] w-[70vw] flex-col align-center">
        <div className="mx-auto flex w-fit flex-col text-center">
          <h1 className="font-extrabold text-6xl">Welcome Back</h1>
          <h6 className="text-lg text-muted-foreground">
            Log in to see proposals, course data and member contact details.
          </h6>

          <div className="my-8">
            <form className="w-full" onSubmit={form.handleSubmit}>
              <FieldGroup>
                <form.Field name="email">
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel className="font-extrabold text-lg" htmlFor={field.name}>
                          University Email
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          className="h-13 gap-1.5 rounded-md px-3.5"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          value={field.state.value}
                        />
                        {isInvalid && field.state.meta.isTouched && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>

                <form.Field name="password">
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
                            className="h-13 w-full gap-1.5 rounded-md px-3.5"
                            id={field.name}
                            name={field.name}
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
                        {isInvalid && field.state.meta.isTouched && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              </FieldGroup>
            </form>

            <div className="my-8">
              <Button
                className="w-full"
                onClick={form.handleSubmit}
                size="xxl"
                type="submit"
                variant="button-mauve"
              >
                Log in
              </Button>
              <div className="mt-4">
                <Link className="text-muted-foreground text-sm" href="/">
                  New here?{" "}
                  <span className="text-brand-mauve underline">Register with your uni email</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Toaster>
  )
}
