#!/usr/bin/env python3
"""Compare the Python canon with the node canon BY VALUE, and prove the comparison can fail.

  python3 materials/compare-ladder.py py.json node.json

Integers must match exactly; floats within 1e-6 absolute plus 1e-9 relative (libm differs in the last
ulp between CPython and V8). Before comparing, the script perturbs one float of a copy by 0.1% and
asserts the comparison FAILS on it; a comparer that cannot fail is not a comparer.
"""
import copy
import json
import sys

ABS, REL = 1e-6, 1e-9


def walk(a, b, path, out):
    if isinstance(a, dict):
        if not isinstance(b, dict) or set(a) != set(b):
            out.append(f"{path}: keys differ {sorted(set(a) ^ set(b or {}))}")
            return
        for k in a:
            walk(a[k], b[k], f"{path}.{k}", out)
    elif isinstance(a, list):
        if not isinstance(b, list) or len(a) != len(b):
            out.append(f"{path}: length {len(a)} vs {len(b) if isinstance(b, list) else type(b).__name__}")
            return
        for i, (x, y) in enumerate(zip(a, b)):
            walk(x, y, f"{path}[{i}]", out)
    elif isinstance(a, bool) or a is None or isinstance(a, str):
        if a != b:
            out.append(f"{path}: {a!r} vs {b!r}")
    elif isinstance(a, int):
        if not (isinstance(b, (int, float)) and float(b) == float(a)):
            out.append(f"{path}: int {a} vs {b}")
    else:
        if not isinstance(b, (int, float)) or abs(a - b) > ABS + REL * abs(a):
            out.append(f"{path}: {a} vs {b}")


def count(a):
    if isinstance(a, dict):
        return sum(count(v) for v in a.values())
    if isinstance(a, list):
        return sum(count(v) for v in a)
    return 1


def first_float(a, path="$"):
    if isinstance(a, dict):
        for k, v in a.items():
            r = first_float(v, f"{path}.{k}")
            if r:
                return r
    elif isinstance(a, list):
        for i, v in enumerate(a):
            r = first_float(v, f"{path}[{i}]")
            if r:
                return r
    elif isinstance(a, float) and a != 0:
        return (a, path)
    return None


def main():
    a = json.load(open(sys.argv[1]))
    b = json.load(open(sys.argv[2]))
    # self-test: a planted 0.1% fault must be caught
    fv, fp = first_float(a["rungs"]["raw"], "$.rungs.raw")
    planted = copy.deepcopy(b)
    planted["rungs"]["raw"][fp.split(".")[-1]] = fv * 1.001
    bad = []
    walk(a, planted, "$", bad)
    if not bad:
        print("SELF-TEST FAILED: a planted 0.1% fault was not detected"); sys.exit(2)
    print(f"self-test: planted fault at {fp} detected ({bad[0]})")
    diffs = []
    walk(a, b, "$", diffs)
    print(f"values compared: {count(a)}")
    if diffs:
        print("\n".join(diffs[:40]))
        print(f"COMPARE FAILED: {len(diffs)} difference(s)"); sys.exit(1)
    print("COMPARE PASSED: python and node agree on every value")


if __name__ == "__main__":
    main()
