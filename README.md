<h1>
  <a href="http://node-machine.org"><img alt="node-machine logo" title="The Node-Machine Project" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" /></a>
  machine (runner)
</h1>


This branch is currently a work in progress.



### Benchmarks

As of [morning, Thursday, August 17, 2017](https://github.com/node-machine/machine/tree/5d68f60a4d95c8c7183c5eb190f0bab3f5937eb0):


```

> machine@15.0.0-3 bench /Users/mikermcneil/code/machine
> node ./node_modules/mocha/bin/mocha -R dot --recursive -b test/benchmarks/



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

 • sanity_check x 788,960 ops/sec ±0.47% (83 runs sampled)
 • build_very_simple_machine x 124,750 ops/sec ±0.72% (80 runs sampled)
 • build_machine_with_inputs_and_exits_but_nothing_crazy x 105,200 ops/sec ±0.96% (81 runs sampled)
 • build_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 95,667 ops/sec ±1.45% (79 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits x 93,262 ops/sec ±0.90% (79 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 94,808 ops/sec ±1.02% (81 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 114,367 ops/sec ±1.10% (81 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 92,227 ops/sec ±1.66% (79 runs sampled)
Fastest is sanity_check
Slowest is build_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars,build_machine_with_crazy_numbers_of_inputs_and_exits

  ․ • sanity_check x 783,917 ops/sec ±0.62% (83 runs sampled)
 • exec_very_simple_machine x 8,800 ops/sec ±2.87% (75 runs sampled)
 • exec_machine_with_inputs_and_exits_but_nothing_crazy x 8,634 ops/sec ±2.40% (74 runs sampled)
 • exec_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 8,548 ops/sec ±2.50% (77 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits x 8,077 ops/sec ±2.63% (75 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 8,061 ops/sec ±2.44% (74 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 8,226 ops/sec ±2.79% (72 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 8,042 ops/sec ±2.67% (74 runs sampled)
Fastest is sanity_check
Slowest is exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars,exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable,exec_machine_with_crazy_numbers_of_inputs_and_exits,exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars
․ • sanity_check x 789,101 ops/sec ±0.49% (84 runs sampled)
 • execSync_very_simple_machine x 8,599 ops/sec ±2.56% (75 runs sampled)
 • execSync_machine_with_inputs_and_exits_but_nothing_crazy x 8,220 ops/sec ±2.57% (75 runs sampled)
 • execSync_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 8,180 ops/sec ±2.49% (70 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits x 7,591 ops/sec ±2.81% (68 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 7,727 ops/sec ±3.00% (68 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 7,706 ops/sec ±2.49% (76 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 7,529 ops/sec ±3.19% (67 runs sampled)
Fastest is sanity_check
Slowest is execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars,execSync_machine_with_crazy_numbers_of_inputs_and_exits,execSync_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable,execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars
․

  3 passing (2m)


  ```
