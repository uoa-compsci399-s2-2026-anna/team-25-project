"use client"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import * as React from "react"
import z from "zod"

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
      console.log(values)
    },
  })

  return (
    <Card className="flex flex-col justify-center px-4 text-center">
      <CardHeader>
        <CardTitle className="font-extrabold text-3xl">Welcome Back</CardTitle>
      </CardHeader>
      <CardDescription>
        Log in to see proposals, course data and member contact details.
      </CardDescription>
      <CardContent>
        <form className="w-full" onSubmit={form.handleSubmit}>
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel className="font-extrabold" htmlFor={field.name}>
                      University Email
                    </FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      className="w-full] rounded-md"
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
                      <FieldLabel className="font-extrabold" htmlFor={field.name}>
                        Password
                      </FieldLabel>
                      <Link className="text-brand-mauve hover:text-primary" href="/">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative w-full">
                      <Input
                        aria-invalid={isInvalid}
                        className="w-full rounded-md pr-14 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
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
      </CardContent>
      <Button className="w-full" onClick={form.handleSubmit} type="submit" variant="button-mauve">
        Log in
      </Button>
      <Link className="text-muted-foreground text-sm hover:text-primary" href="/">
        New here? <span className="text-brand-mauve underline">Register with your uni email</span>
      </Link>
    </Card>
  )
}
