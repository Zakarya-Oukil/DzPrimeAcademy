import { NextResponse } from 'next/server';

// Wraps a route handler so common failures become the right answer instead of a 500 with raw database text:
// missing record (P2025) -> 404, duplicate (P2002) -> 409, bad reference (P2003) -> 400, unreadable JSON -> 400.
// Anything else is logged on the server and answered with a plain 500.
export function guard<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e: any) {
      if (e?.code === 'P2025') return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
      if (e?.code === 'P2002') return NextResponse.json({ error: 'القيمة مستخدمة مسبقاً' }, { status: 409 });
      if (e?.code === 'P2003') return NextResponse.json({ error: 'مرجع غير صالح' }, { status: 400 });
      if (e instanceof SyntaxError) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
      console.error('Unhandled route error:', e);
      return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
    }
  };
}

// Returns the name of the first optional text field that is not a string or is longer than its limit
// (undefined and null are allowed: "not sent" / "clear it"). Use as: textProblem({ bio: [body.bio, 1000] }).
export function textProblem(fields: Record<string, [unknown, number]>): string | null {
  for (const [name, [val, max]] of Object.entries(fields)) {
    if (val !== undefined && val !== null && (typeof val !== 'string' || val.length > max)) return name;
  }
  return null;
}

// True for an optional integer inside [min, max] (undefined passes, because the field was not sent).
export function intInRange(val: unknown, min: number, max: number): boolean {
  return val === undefined || (typeof val === 'number' && Number.isInteger(val) && val >= min && val <= max);
}

export const badField = (name: string) =>
  NextResponse.json({ error: `قيمة غير صالحة: ${name}` }, { status: 400 });
