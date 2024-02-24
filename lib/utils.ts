import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PencilIcon } from '@heroicons/react/24/solid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toUpperSnake(str: string) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toUpperCase();
}

export type HeroIcon = typeof PencilIcon;
