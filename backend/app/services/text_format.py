"""Small text-formatting helpers shared across email/certificate rendering."""


def natural_join(items: list[str]) -> str:
    """Join items the way a person would write them in a sentence.

    ``["A"]`` -> ``"A"``, ``["A", "B"]`` -> ``"A and B"``,
    ``["A", "B", "C"]`` -> ``"A, B and C"``.
    """

    if len(items) <= 1:
        return items[0] if items else ""
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])} and {items[-1]}"
