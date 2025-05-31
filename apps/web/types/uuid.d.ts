declare module 'uuid' {
  export function v1(options?: any, buffer?: any, offset?: number): string;
  export function v3(name: string | Buffer, namespace: string | Buffer): string;
  export function v4(options?: any, buffer?: any, offset?: number): string;
  export function v5(name: string | Buffer, namespace: string | Buffer): string;
  export function parse(uuid: string): Buffer;
  export function unparse(buffer: Buffer, offset?: number): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
}