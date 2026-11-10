import { zodResolver } from "@hookform/resolvers/zod"
import {
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  get,
  type SubmitHandler,
  useForm as useReactHookForm,
} from "react-hook-form"
import { toast } from "sonner"
import type { ZodType } from "zod"

const DEFAULT_VALIDATION_MESSAGE = "Verifique os campos destacados."
const DEFAULT_SUBMIT_ERROR_MESSAGE = "Ocorreu um erro. Tenta novamente."

function findErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined

  const message = (value as { message?: unknown }).message
  if (typeof message === "string") return message

  for (const nestedValue of Object.values(value)) {
    const nestedMessage = findErrorMessage(nestedValue)
    if (nestedMessage) return nestedMessage
  }

  return undefined
}

function getSubmitErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const response = (error as { response?: unknown }).response
    const data =
      response && typeof response === "object"
        ? (response as { data?: unknown }).data
        : undefined

    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message
      if (typeof message === "string") return message
    }
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

export type UseAppFormOptions<TFieldValues extends FieldValues> = {
  schema: ZodType<TFieldValues, TFieldValues>
  onSubmit: SubmitHandler<TFieldValues, void | Promise<void>>
  defaultValues?: DefaultValues<TFieldValues>
  successMessage?: string
  errorMessage?: string
  validationErrorMessage?: string
}

export function useAppForm<TFieldValues extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  successMessage,
  errorMessage,
  validationErrorMessage = DEFAULT_VALIDATION_MESSAGE,
}: UseAppFormOptions<TFieldValues>) {
  const form = useReactHookForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  })

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(data)
        if (successMessage) toast.success(successMessage)
      } catch (error) {
        toast.error(
          getSubmitErrorMessage(
            error,
            errorMessage ?? DEFAULT_SUBMIT_ERROR_MESSAGE,
          ),
        )
      }
    },
    (errors) => {
      toast.error(findErrorMessage(errors) ?? validationErrorMessage)
    },
  )

  const fieldError = (name: FieldPath<TFieldValues>) =>
    findErrorMessage(get(form.formState.errors, name))

  return {
    form,
    handleSubmit,
    fieldError,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    reset: form.reset,
    setValue: form.setValue,
    setFocus: form.setFocus,
    clearErrors: form.clearErrors,
  }
}
