/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */
 
/**
 *  @class
 *
 *  A virtual class that allows the definition of pre-baked transitions that can be used as parameter
 *  for the {@link Element#applyTransition} method. In reality, any object that provides the type of
 *  properties instances of this class offers can be used with that method.
 *
 *  @name TKTransitionDefinition
 *  @since TuneKit 1.0
 */

/**
 *  @name TKTransitionDefinition.prototype
 *  @property {Array} base A set of property / value pairs that are applied to the element as the transition starts. The properties
 *  listed there are not supposed to be transitioned. If you wish to set a from state for a property that gets transitioned, use
 *  the {@link #properties} and {@link from} properties instead.
 *  @property {Array} properties The set of properties that will be transitioned. The properties are CSS properties
 *  of the element that will be transitioned using this definition.
 *  @property {Array} from Optional list of values to start the transition from. Each value in this array must match the property
 *  at the same index in the {@link #properties} array.
 *  @property {Array} to Required list of values to transition to. Each value in this array must match the property
 *  at the same index in the {@link #properties} array.
 */

/**
 *  Fades out.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionDissolveOut = {
  properties : ['opacity'],
  from : [1],
  to : [0]
};

/**
 *  Fades in.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionDissolveIn = {
  properties : ['opacity'],
  from : [0],
  to : [1]
};

/**
 *  Fades in while scaling up to identity scale.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionZoomIn = {
  properties : ['opacity', '-webkit-transform'],
  from : [0, 'scale(0.2)'],
  to : [1, 'scale(1)']
};

/**
 *  Fades out while scaling down to identity scale.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionZoomOut = {
  properties : ['opacity', '-webkit-transform'],
  from : [0, 'scale(1.2)'],
  to : [1, 'scale(1)']
};

/**
 *  Fades in while rotating from the right.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionCrossSpinRight = {
  properties : ['opacity', '-webkit-transform'],
  from : [0, 'rotate(20deg)'],
  to : [1, 'rotate(0)']
};

/**
 *  Fades in while rotating from the left.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionCrossSpinLeft = {
  properties : ['opacity', '-webkit-transform'],
  from : [0, 'rotate(-20deg)'],
  to : [1, 'rotate(0)']
};

/**
 *  Scale transition scaling in.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionScaleIn = {
  base : ['z-index', 1],
  properties : ['-webkit-transform'],
  from : ['scale(0.01)'],
  to : ['scale(1)']
};

/**
 *  Scale transition scaling out.
 *  @constant
 *  @type TKTransitionDefinition
 */
const TKViewTransitionScaleOut = {
  base : ['z-index', 1],
  properties : ['-webkit-transform'],
  from : ['scale(1)'],
  to : ['scale(0.01)']
};
