import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  // não aplica o erro se os campos não foram inicializados
  if (!password || !confirmPassword) {
    return null;
  }

  // caso as senhas não correspondam, aplica o erro no input de confirmPassword
  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordsMismatch: true });
  } else if (confirmPassword.hasError('passwordsMismatch')) {
    // quando as senhas passarem a corresponder, deleta o mismatch e reatribui erros anteriores
    const errors = { ...confirmPassword.errors };
    delete errors['passwordsMismatch'];
    confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
  }

  return null;
};

export default passwordsMatchValidator;
