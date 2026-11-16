import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function useAppForm({ schema, defaultValues, onSubmit }) {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues,
        mode: "onTouched",
        reValidateMode: "onChange",
    });

    return {
        form,
        handleSubmit: form.handleSubmit(onSubmit),
        isSubmitting: form.formState.isSubmitting,
        fieldError: (name) => form.formState.errors[name]?.message,
    };
}
