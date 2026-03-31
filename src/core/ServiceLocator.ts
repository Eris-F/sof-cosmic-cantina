/**
 * Lightweight dependency injection container.
 *
 * Register services during bootstrap, optionally freeze the container,
 * then resolve them wherever needed.
 *
 * @module core/ServiceLocator
 */

import type { IServiceLocator, ServiceLocatorOptions } from '../types/index';

export class ServiceLocator implements IServiceLocator {
  private _services: Map<string, unknown>;
  private _factories: Map<string, () => unknown>;
  private _frozen: boolean;

  constructor() {
    this._services = new Map();
    this._factories = new Map();
    this._frozen = false;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Register a ready-to-use service instance.
   */
  register<T>(name: string, instance: T): void {
    this._assertNotFrozen('register');
    this._validateName(name);
    this._services.set(name, instance);
  }

  /**
   * Register a factory for lazy instantiation. The factory is called at most
   * once — on the first `resolve`. The return value is cached as the service.
   */
  registerFactory<T>(name: string, factory: () => T): void {
    this._assertNotFrozen('registerFactory');
    this._validateName(name);
    if (typeof factory !== 'function') {
      throw new TypeError(
        `ServiceLocator.registerFactory: factory for "${name}" must be a function`,
      );
    }
    this._factories.set(name, factory);
  }

  /**
   * Retrieve a service by name. Factories are resolved lazily on first call.
   */
  resolve<T>(name: string): T {
    this._validateName(name);

    if (this._services.has(name)) {
      return this._services.get(name) as T;
    }

    if (this._factories.has(name)) {
      const factory = this._factories.get(name)!;
      const instance: unknown = factory();
      // Cache the instance and remove the factory
      this._services.set(name, instance);
      this._factories.delete(name);
      return instance as T;
    }

    throw new Error(
      `ServiceLocator.resolve: service "${name}" is not registered`,
    );
  }

  /**
   * Check whether a service (or factory) is registered.
   */
  has(name: string): boolean {
    return this._services.has(name) || this._factories.has(name);
  }

  /**
   * Freeze the container. After this call, `register` and `registerFactory`
   * will throw, preventing accidental mutation during gameplay.
   */
  freeze(): void {
    this._frozen = true;
  }

  /**
   * Clear all registrations and unfreeze. Intended for test teardown.
   */
  reset(): void {
    this._services = new Map();
    this._factories = new Map();
    this._frozen = false;
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private _assertNotFrozen(method: string): void {
    if (this._frozen) {
      throw new Error(
        `ServiceLocator.${method}: container is frozen — call reset() first`,
      );
    }
  }

  private _validateName(name: string): void {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('ServiceLocator: name must be a non-empty string');
    }
  }
}

// ── Singleton factory ─────────────────────────────────────────────────────────

let _instance: ServiceLocator | null = null;

/**
 * Returns the shared ServiceLocator singleton.
 */
export function createServiceLocator(options: ServiceLocatorOptions = {}): ServiceLocator {
  if (options.fresh || _instance === null) {
    _instance = new ServiceLocator();
  }
  return _instance;
}
