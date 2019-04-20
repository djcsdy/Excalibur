import { Color } from '../Drawing/Color';
import * as DrawUtil from '../Util/DrawUtil';
import { Eventable } from '../Interfaces/Index';
import { GameEvent, PostCollisionEvent, PreCollisionEvent, CollisionStartEvent, CollisionEndEvent } from '../Events';
import { Actor } from '../Actor';
import { Body } from './Body';
import { CollisionGeometry } from './CollisionGeometry';
import { Vector } from '../Algebra';
import { Physics, CollisionResolutionStrategy } from '../Physics';
import { BoundingBox } from './BoundingBox';
import { ConvexPolygon } from './ConvexPolygon';
import { CollisionType } from './CollisionType';
import { CollisionGroup } from './CollisionGroup';

function isCollider(x: Actor | Collider): x is Collider {
  return !!x && x instanceof Collider;
}

// Describes material properties like shape, bounds, friction of the physics object
export class Collider implements Eventable {
  private _collisionArea: CollisionGeometry;

  constructor(private _actor: Actor, private _body: Body) {}

  emit(eventName: string, event?: GameEvent<any>): void {
    if (event instanceof PreCollisionEvent && isCollider(event.actor) && isCollider(event.other)) {
      this._actor.emit(eventName, new PreCollisionEvent(event.actor._actor, event.other._actor, event.side, event.intersection));
    } else if (event instanceof PostCollisionEvent && isCollider(event.actor) && isCollider(event.other)) {
      this._actor.emit(eventName, new PostCollisionEvent(event.actor._actor, event.other._actor, event.side, event.intersection));
    } else if (event instanceof CollisionStartEvent && isCollider(event.actor) && isCollider(event.other)) {
      this._actor.emit(eventName, new CollisionStartEvent(event.actor._actor, event.other._actor, event.pair));
    } else if (event instanceof CollisionEndEvent && isCollider(event.actor) && isCollider(event.other)) {
      this._actor.emit(eventName, new CollisionEndEvent(event.actor._actor, event.other._actor));
    } else {
      this._actor.emit(eventName, event);
    }
  }
  on(eventName: string, handler: (event?: GameEvent<any>) => void): void {
    this._actor.on(eventName, handler);
  }
  off(eventName: string, handler?: (event?: GameEvent<any>) => void): void {
    this._actor.off(eventName, handler);
  }
  once(eventName: string, handler: (event?: GameEvent<any>) => void): void {
    this._actor.once(eventName, handler);
  }

  public get id(): number {
    return this._actor.id;
  }

  /**
   * Gets or sets the current collision type of this collider. By
   * default it is ([[CollisionType.PreventCollision]]).
   */
  public collisionType: CollisionType = CollisionType.PreventCollision;

  /**
   * Gets or sets the current [[CollisionGroup|collision group]] for the collider, colliders with like collision groups do not collide.
   * By default, the collider will collide with all groups.
   */
  public collisionGroup: CollisionGroup = CollisionGroup.All;

  public get shape(): CollisionGeometry {
    return this._collisionArea;
  }

  public set shape(shape: CollisionGeometry) {
    this._collisionArea = shape;
    this._collisionArea.collider = this;
  }

  public get body(): Body {
    return this._body;
  }

  public get center(): Vector {
    return this._actor.getCenter();
  }

  /**
   * Is this collider active, if false it wont collide
   */
  public get active(): boolean {
    return !this._actor.isKilled();
  }

  /**
   * The current mass of the actor, mass can be thought of as the resistance to acceleration.
   */
  public mass: number = 1.0;

  /**
   * The current moment of inertia, moi can be thought of as the resistance to rotation.
   */
  public moi: number = 1000;

  /**
   * The coefficient of friction on this actor
   */
  public friction: number = 0.99;

  /**
   * The coefficient of restitution of this actor, represents the amount of energy preserved after collision
   */
  public restitution: number = 0.2;

  /**
   * Returns the body's [[BoundingBox]] calculated for this instant in world space.
   */
  public getBounds(): BoundingBox {
    if (Physics.collisionResolutionStrategy === CollisionResolutionStrategy.Box) {
      return this._actor.getBounds();
    } else {
      return this.shape.getBounds();
    }
  }

  /**
   * Returns the actor's [[BoundingBox]] relative to the actors position.
   */
  public getRelativeBounds(): BoundingBox {
    if (Physics.collisionResolutionStrategy === CollisionResolutionStrategy.Box) {
      return this._actor.getRelativeBounds();
    } else {
      return this._actor.getRelativeBounds();
    }
  }

  /**
   * Updates the collision area geometry and internal caches
   */
  public update() {
    if (this.shape) {
      // Update the geometry if needed
      if (this.body && this.body.isGeometryDirty && this.shape instanceof ConvexPolygon) {
        this.shape.points = this._actor.getRelativeGeometry();
      }

      this.shape.recalc();
    }
  }

  /* istanbul ignore next */
  public debugDraw(ctx: CanvasRenderingContext2D) {
    // Draw motion vectors
    if (Physics.showMotionVectors) {
      DrawUtil.vector(ctx, Color.Yellow, this._body.pos, this._body.acc.add(Physics.acc));
      DrawUtil.vector(ctx, Color.Red, this._body.pos, this._body.vel);
      DrawUtil.point(ctx, Color.Red, this._body.pos);
    }

    if (Physics.showBounds) {
      this.getBounds().debugDraw(ctx, Color.Yellow);
    }

    if (Physics.showArea) {
      this.shape.debugDraw(ctx, Color.Green);
    }
  }
}
