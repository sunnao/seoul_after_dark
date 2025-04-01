import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface AuthInputProps {
  label?: string;
  labelIcon?: React.ReactNode;
  id?: string;
  type: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
}

export const AuthInput = ({
  label,
  labelIcon,
  id,
  type,
  placeholder,
  registration,
  error,
  disabled,
}: AuthInputProps) => {
  return (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <label className={`input w-full ${error ? 'input-error' : ''}`}>
        {labelIcon && <span className="h-[1em] opacity-50">{labelIcon}</span>}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          name={registration.name}
          onChange={registration.onChange}
          onBlur={registration.onBlur}
          ref={registration.ref}
          disabled={disabled}
        />
      </label>
      {error && <label className="text-error">{error.message}</label>}
    </>
  );
};
