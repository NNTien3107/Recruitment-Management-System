import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button, FormError, Input } from '../../components/ui';
import { getErrorMessage } from '../../lib/errors';
import { AuthCard } from './AuthCard';
import { useAuth } from './auth-context';

const loginSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // Đăng nhập xong, GuestOnlyRoute tự chuyển hướng
  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <AuthCard
      title="Đăng nhập"
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <FormError message={serverError} />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Đăng nhập
        </Button>
      </form>
    </AuthCard>
  );
}
