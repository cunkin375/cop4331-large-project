import { useId, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
}

function FormField({ label, hint, ...inputProps }: FormFieldProps) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    return (
        <div className="grid gap-1">
            <label htmlFor={id} className="font-semibold">{label}</label>
            <input id={id} aria-describedby={hintId} className="field" {...inputProps} />
            {hint && <p id={hintId} className="text-sm text-chalk/75">{hint}</p>}
        </div>
    );
}

export default FormField;
