
import React from 'react';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};
