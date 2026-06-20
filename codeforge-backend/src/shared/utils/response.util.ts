import { Response } from 'express';

export const success = (res: Response, data: any = null, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const paginated = (res: Response, data: any[], total: number, page: number, limit: number, message: string = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const error = (res: Response, message: string = 'Error', statusCode: number = 400, details?: any) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
      details,
    },
  });
};
