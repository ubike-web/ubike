import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../../shared/errors';

export function validate(schema: Joi.ObjectSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map(d => d.message).join('; ');
      return next(new ValidationError(message));
    }
    req[target] = value;
    next();
  };
}
