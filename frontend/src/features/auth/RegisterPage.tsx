import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button, FormError, Input, Select } from '../../components/ui';
import { getErrorMessage } from '../../lib/errors';
import { AuthCard } from './AuthCard';
import { registerRequest } from './auth.api';
import { useAuth } from './auth-context';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
    email: z.string().trim().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(128, 'Mật khẩu tối đa 128 ký tự'),
    confirmPassword: z.string(),
    role: z.enum(['CANDIDATE', 'RECRUITER']),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });
type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CANDIDATE' },
  });

  const onSubmit = handleSubmit(async ({ fullName, email, password, role }) => {
    setServerError(null);
    try {
      await registerRequest({ fullName, email, password, role });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setError('email', { message: 'Email này đã được sử dụng' }); // BR-01
      } else {
        setServerError(getErrorMessage(error));
      }
      return;
    }

    try {
      await login(email, password); // GuestOnlyRoute tự chuyển hướng theo vai trò
    } catch {
      setServerError('Đăng ký thành công nhưng chưa đăng nhập được, vui lòng đăng nhập thủ công');
    }
  });

  return (
    <AuthCard
      title="Đăng ký tài khoản"
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
        <Input
          label="Họ và tên"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
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
          autoComplete="new-password"
          hint="Tối thiểu 8 ký tự"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Select label="Bạn là" error={errors.role?.message} {...register('role')}>
          <option value="CANDIDATE">Ứng viên (tìm việc)</option>
          <option value="RECRUITER">Nhà tuyển dụng</option>
        </Select>
        <FormError message={serverError} />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Đăng ký
        </Button>
      </form>
    </AuthCard>
  );
}
