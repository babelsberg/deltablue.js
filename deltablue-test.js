import * as deltablue from './deltablue.js'

describe('DeltaBlue', function() {
    it("runs the standard benchmark", function() {
        /**
         * This is the standard DeltaBlue benchmark. A long chain of equality
         * constraints is constructed with a stay constraint on one end. An
         * edit constraint is then added to the opposite end and the time is
         * measured for adding and removing this constraint, and extracting
         * and executing a constraint satisfaction plan. There are two cases.
         * In case 1, the added constraint is stronger than the stay
         * constraint and values must propagate down the entire length of the
         * chain. In case 2, the added constraint is weaker than the stay
         * constraint so it cannot be accomodated. The cost in this case is,
         * of course, very low. Typical situations lie somewhere between these
         * two extremes.
         */
        var n = 100;
        var planner = new deltablue.Planner();
        var prev = null, first = null, last = null;
        var variables = [];

        // Build chain of n equality constraints
        for (var i = 0; i <= n; i++) {
            var name = 'v' + i;
            var v = new deltablue.Variable(name, 0, planner);
            if (prev != null) {
                var c = new deltablue.EqualityConstraint(
                                prev, v, deltablue.Strength.REQUIRED, planner);
                c.addConstraint();
            }
            if (i == 0) first = v;
            if (i == n) last = v;
            prev = v;
            variables.push(v);
        }

        var c = new deltablue.StayConstraint(last, deltablue.Strength.STRONG_DEFAULT, planner);
        c.addConstraint();
        var edit = new deltablue.EditConstraint(first, deltablue.Strength.PREFERRED, planner);
        var edits = new deltablue.OrderedCollection();
        edit.addConstraint();
        edits.add(edit);
        var plan = planner.extractPlanFromConstraints(edits);
        for (var i = 0; i < 100; i++) {
            first.value = i;
            plan.execute();
            if (last.value != i) {
                throw 'Chain test failed.';
            }
        }
    });

    it("can do projection", function() {
        /**
         * This test constructs a two sets of variables related to each
         * other by a simple linear transformation (scale and offset). The
         * time is measured to change a variable on either side of the
         * mapping and to change the scale and offset factors.
         */
        var n = 100;
        var planner = new deltablue.Planner();
        var scale = new deltablue.Variable('scale', 10, planner);
        var offset = new deltablue.Variable('offset', 1000, planner);
        var src = null, dst = null;

        var dests = new deltablue.OrderedCollection();
        for (var i = 0; i < n; i++) {
            src = new deltablue.Variable('src' + i, i, planner);
            dst = new deltablue.Variable('dst' + i, i, planner);
            dests.add(dst);
            var st = new deltablue.StayConstraint(src, deltablue.Strength.NORMAL, planner),
                sc = new deltablue.ScaleConstraint(
                        src, scale, offset, dst, deltablue.Strength.REQUIRED, planner
                    );
            st.addConstraint();
            sc.addConstraint();
        }

        src.assignValue(17);
        if (dst.value != 1170) throw('Projection 1 failed');
        dst.assignValue(1050);
        if (src.value != 5) throw('Projection 2 failed');
        scale.assignValue(5);
        for (var i = 0; i < n - 1; i++) {
            if (dests.at(i).value != i * 5 + 1000)
                throw('Projection 3 failed');
        }
        offset.assignValue(2000);
        for (var i = 0; i < n - 1; i++) {
            if (dests.at(i).value != i * 5 + 2000)
                throw('Projection 4 failed');
        }
    });
});
