System.register([], function (_export) {
  "use strict";

  var COMPLETED, CANCELLED, REJECTED, RUNNING, Pipeline;
  function createResult(ctx, next) {
    return {
      status: next.status,
      context: ctx,
      output: next.output,
      completed: next.status == COMPLETED
    };
  }

  return {
    setters: [],
    execute: function () {
      COMPLETED = _export("COMPLETED", "completed");
      CANCELLED = _export("CANCELLED", "cancelled");
      REJECTED = _export("REJECTED", "rejected");
      RUNNING = _export("RUNNING", "running");
      Pipeline = function Pipeline() {
        this.steps = [];
      };

      Pipeline.prototype.withStep = function (step) {
        var run;

        if (typeof step == "function") {
          run = step;
        } else {
          run = step.run.bind(step);
        }

        this.steps.push(run);

        return this;
      };

      Pipeline.prototype.run = function (ctx) {
        var index = -1, steps = this.steps, next, currentStep;

        next = function () {
          index++;

          if (index < steps.length) {
            currentStep = steps[index];

            try {
              return currentStep(ctx, next);
            } catch (e) {
              return next.reject(e);
            }
          } else {
            return next.complete();
          }
        };

        next.complete = function (output) {
          next.status = COMPLETED;
          next.output = output;
          return Promise.resolve(createResult(ctx, next));
        };

        next.cancel = function (reason) {
          next.status = CANCELLED;
          next.output = reason;
          return Promise.resolve(createResult(ctx, next));
        };

        next.reject = function (error) {
          next.status = REJECTED;
          next.output = error;
          return Promise.reject(createResult(ctx, next));
        };

        next.status = RUNNING;

        return next();
      };

      _export("Pipeline", Pipeline);
    }
  };
});