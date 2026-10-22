"""Independent finite-distribution checks of the article's identities and bounds.

Uses only the Python standard library; this is a mathematical validation, not
evidence that any measured LLM satisfies the uniform small-gap assumption.
"""
import itertools
import json
import math
import random


def lse(values):
    peak = max(values)
    return peak + math.log(sum(math.exp(v - peak) for v in values))


def softmax(values):
    normalizer = lse(values)
    return [math.exp(v - normalizer) for v in values]


def close(a, b, tol=2e-11):
    assert math.isclose(a, b, rel_tol=tol, abs_tol=tol), (a, b)


def local(early, final, w):
    pe, pk = softmax(early), softmax(final)
    log_a = [(1 + w) * math.log(k) - w * math.log(e) for k, e in zip(pk, pe)]
    return pe, pk, softmax(log_a), lse(log_a)


def main():
    rng = random.Random(20261022)
    for _ in range(500):
        vocab = rng.randint(2, 20)
        early = [rng.uniform(-3, 3) for _ in range(vocab)]
        delta = [rng.uniform(-2, 2) for _ in range(vocab)]
        final = [e + d for e, d in zip(early, delta)]
        w = rng.uniform(0, 3)
        pe, pk, q, log_c = local(early, final, w)
        kl_q = sum(p * math.log(p / r) for p, r in zip(pk, q))
        kl_e = sum(p * math.log(p / r) for p, r in zip(pk, pe))
        close(log_c, kl_q + w * kl_e)
        upper = w * (1 + w) * (max(delta) - min(delta)) ** 2 / 8
        assert -2e-11 <= log_c <= upper + 2e-11
        logits_q = softmax([(1 + w) * f - w * e for e, f in zip(early, final)])
        for a, b in zip(q, logits_q):
            close(a, b)
        shifted = local([e + 7 for e in early], [f - 4 for f in final], w)
        close(log_c, shifted[3])
        for a, b in zip(q, shifted[2]):
            close(a, b)

    # Construct whole sequence distributions independently of local normalization.
    max_sequence_error = 0
    for _ in range(80):
        depth, w = 4, rng.uniform(.1, 2)
        nodes = {}
        for t in range(depth):
            for s in itertools.product(range(2), repeat=t):
                early = [rng.uniform(-2, 2) for _ in range(2)]
                final = [e + rng.uniform(-.5, .5) for e in early]
                nodes[s] = local(early, final, w)
        answers = list(itertools.product(range(2), repeat=depth))
        p_e, p_k, q_local, path_log_c = [], [], [], []
        for y in answers:
            p_e.append(math.prod(nodes[y[:t]][0][v] for t, v in enumerate(y)))
            p_k.append(math.prod(nodes[y[:t]][1][v] for t, v in enumerate(y)))
            q_local.append(math.prod(nodes[y[:t]][2][v] for t, v in enumerate(y)))
            path_log_c.append(sum(nodes[y[:t]][3] for t in range(depth)))
        scores = [k ** (1 + w) / e ** w for k, e in zip(p_k, p_e)]
        z = sum(scores)
        joint = [a / z for a in scores]
        close(sum(joint), 1)
        close(sum(q_local), 1)
        close(z, sum(q * math.exp(d) for q, d in zip(q_local, path_log_c)))
        eta = max(n[3] for n in nodes.values())
        for q, j, d in zip(q_local, joint, path_log_c):
            error = math.log(q / j)
            close(error, math.log(z) - d)
            assert abs(error) <= depth * eta + 2e-11
            max_sequence_error = max(max_sequence_error, abs(error))

        # Recursion for H versus conditionals from explicitly marginalized joint.
        def h(s):
            if len(s) == depth:
                return 1.0
            pe, pk, _, _ = nodes[s]
            return sum(pk[v] ** (1 + w) / pe[v] ** w * h(s + (v,)) for v in range(2))

        close(h(()), z)
        for s, (pe, pk, _, _) in nodes.items():
            mass = sum(p for y, p in zip(answers, joint) if y[:len(s)] == s)
            for v in range(2):
                child = s + (v,)
                marginal = sum(p for y, p in zip(answers, joint) if y[:len(child)] == child) / mass
                close(marginal, pk[v] ** (1 + w) / pe[v] ** w * h(child) / h(s))

    early, direction, w = [-1, .2, 1.5], [-.7, .1, .9], .7
    pe = softmax(early)
    mu = sum(p * d for p, d in zip(pe, direction))
    variance = sum(p * (d - mu) ** 2 for p, d in zip(pe, direction))
    taylor = []
    for eps in [.05, .025, .0125, .00625]:
        final = [e + eps * d for e, d in zip(early, direction)]
        _, pk, q, exact = local(early, final, w)
        quadratic = w * (1 + w) * variance * eps ** 2 / 2
        odds_change = math.log(q[0] / q[1]) - math.log(pk[0] / pk[1])
        close(odds_change, w * eps * (direction[0] - direction[1]))
        taylor.append(dict(epsilon=eps, log_c=exact, absolute_error=abs(exact - quadratic)))
    quadratic_ratio = taylor[-2]['log_c'] / taylor[-1]['log_c']
    cubic_ratio = taylor[-2]['absolute_error'] / taylor[-1]['absolute_error']
    assert 3.8 < quadratic_ratio < 4.2
    assert 7.5 < cubic_ratio < 8.5
    print(json.dumps(dict(status="passed", categorical_cases=500, sequence_trees=80,
                         sequences_per_tree=16, identities=["softmax guidance", "KL normalizer",
                         "offset invariance", "range bound", "sequence bound", "partition identity",
                         "lookahead conditional", "first-order log-odds"],
                         taylor_halving_ratios=dict(log_c=quadratic_ratio, remainder=cubic_ratio)), indent=2))


if __name__ == "__main__":
    main()
