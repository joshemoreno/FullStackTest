import { ValidationError } from "@nestjs/common";

export function flattenErrors(errors: ValidationError[]) {
  const result: { field: string; errors: string[] }[] = [];

  const visit = (e: ValidationError, parentPath = '') => {
    const path = parentPath ? `${parentPath}.${e.property}` : e.property;
    const constraints = e.constraints ? Object.values(e.constraints) : [];
    if (constraints.length) result.push({ field: path, errors: constraints });
    (e.children ?? []).forEach((c) => visit(c, path));
  };

  errors.forEach((e) => visit(e));
  return result;
}