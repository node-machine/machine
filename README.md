<h1>
  <a href="http://node-machine.org"><img alt="node-machine logo" title="The Node-Machine Project" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" /></a>
  machine (runner)
</h1>


This branch is currently a work in progress.



### Benchmarks

As of [morning, Friday, August 18, 2017](https://github.com/node-machine/machine/tree/35548a4a1425d5a21bff481470a615c0561a536b):


```

> machine@15.0.0-3 bench /Users/mikermcneil/code/machine
> NODE_ENV=production node ./node_modules/mocha/bin/mocha -R dot --recursive -b test/benchmarks/exec.benchmark.js


   o

       •
      o                  .
       •                •
        •                •
                •       o
                            •        o
 o   •              •          o   •
      o              o         •
  •  •      •       •      •    •
           •      •              o
  •    b e n c h m a r k s      •
   •        •
 •                        ___  •
    • o •    •      •    /o/•\_   •
       •   •  o    •    /_/\ o \_ •
       o    O   •   o • •   \ o .\_
          •       o  •       \. O  \


  • sanity_check x 772,990 ops/sec ±0.44% (83 runs sampled)
  • exec_very_simple_machine x 40,115 ops/sec ±3.87% (69 runs sampled)
  • exec_machine_with_inputs_and_exits_but_nothing_crazy x 32,824 ops/sec ±4.00% (63 runs sampled)
  • exec_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 30,845 ops/sec ±4.25% (69 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits x 23,494 ops/sec ±2.91% (72 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 23,073 ops/sec ±2.82% (70 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 24,805 ops/sec ±2.57% (71 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 22,092 ops/sec ±2.46% (68 runs sampled)
 Fastest is sanity_check
 Slowest is exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars,exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable
  ```
