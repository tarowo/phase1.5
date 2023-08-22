/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/* ==================== TKTransaction ==================== */

/**
 *  @class
 *
 *  <p>A transaction allows to run a variety of transitions in sync, no matter in what function or JavaScript run loop
 *  the transition itself was applied. Transactions can be nested, and a transaction is only truly commited when there
 *  are no other open transactions. In other words, there must be as many calls to {@link TKTransaction.begin} as there
 *  are calls to {@link TKTransaction.commit} before any transition in one of those transactions can be applied.
 *
 *  @since TuneKit 1.0
 */
var TKTransaction = {
  transitions : [],
  openTransactions : 0,
  /**
   *  The set of default properties that will be applied to any {@link TKTransition} until the next call to {@link TKTransaction.commit}.
   *  Any of the properties that can be applied to a {@link TKTransition} can be applied to this object.
   *  @type Object
   */
  defaults : {},
  defaultsStates : []
};

/**
 *  Begins a new transaction and makes it the current transaction.
 */
TKTransaction.begin = function () {
  // reset the group if we're starting fresh
  if (this.openTransactions == 0) {
    this.transitions = [];
    this.defaults = {};
  }
  // otherwise, archive the current state of defaults
  else {
    this.defaultsStates.push(this.defaults);
    // XXX: should we restore defaults here as well?
  }
  // increase the number of open transactions
  this.openTransactions++;
};

/**
 *  Add Transition
 *
 *  @private
 */
TKTransaction.addTransition = function (transition) {
  // first, apply the transaction defaults to the transitions
  for (var i in this.defaults) {
    if (transition[i] === null) {
      transition[i] = this.defaults[i];
    }
  }
  // and add the transition to our array
  this.transitions.push(transition);
};

/**
 *  Closes the current transaction.
 */
TKTransaction.commit = function () {
  // do nothing if we have no open transactions
  if (this.openTransactions == 0) {
    return;
  }
  // decrease the number of open transactions
  this.openTransactions--;
  // if we still have open transactions, just
  // restore the previous defaults state
  if (this.openTransactions != 0) {
    this.defaults = this.defaultsStates.pop();
    return;
  }
  // otherwise, it's time to shake and bake, we'll apply the
  // "from" states directly and the "to" states immediately
  // after in a new run loop so that the "from" styles have
  // been resolved first
  var transitions = this.transitions;
  for (var i = 0; i < transitions.length; i++) {
    transitions[i].applyFromState();
  }
  setTimeout(function () {
    for (var i = 0; i < transitions.length; i++) {
      transitions[i].applyToState();
    }
  }, 0);
};

TKUtils.setupDisplayNames(TKTransaction, 'TKTransaction');
