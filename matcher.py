from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass
class Profile:
    name: str
    age: int | None
    gender: str
    city: str
    likes: set[str]
    bio: str = ""
    photo_url: str = ""


def parse_likes(value: str | None) -> set[str]:
    if not value:
        return set()
    return {
        item.strip().lower()
        for item in str(value).split(",")
        if item and item.strip()
    }


def age_score(age_a: int | None, age_b: int | None, max_gap: int = 15) -> float:
    if age_a is None or age_b is None:
        return 0.0
    gap = abs(age_a - age_b)
    return max(0.0, 1.0 - (gap / max_gap))


def jaccard_similarity(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def compatibility_score(source: Profile, candidate: Profile) -> float:
    likes_component = jaccard_similarity(source.likes, candidate.likes)
    city_component = 1.0 if source.city and candidate.city and source.city.lower() == candidate.city.lower() else 0.0
    age_component = age_score(source.age, candidate.age)

    # Weighted blend, easy to tweak for future customization.
    return (0.8 * likes_component) + (0.1 * city_component) + (0.1 * age_component)


def top_matches(selected: Profile, profiles: Iterable[Profile], limit: int = 5) -> list[tuple[Profile, float, set[str]]]:
    scored: list[tuple[Profile, float, set[str]]] = []

    for profile in profiles:
        if profile.name.strip().lower() == selected.name.strip().lower():
            continue
        score = compatibility_score(selected, profile)
        common_likes = selected.likes & profile.likes
        scored.append((profile, score, common_likes))

    scored.sort(key=lambda row: row[1], reverse=True)
    return scored[:limit]
