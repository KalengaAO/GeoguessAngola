from django.contrib import admin

from .models import QuizAnswer, QuizOption, QuizQuestion, QuizSession


class QuizOptionInline(admin.TabularInline):
    model = QuizOption
    extra = 4
    max_num = 4


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("question", "category", "province", "is_active")
    list_filter = ("category", "province", "is_active")
    search_fields = ("question", "province")
    inlines = [QuizOptionInline]


@admin.register(QuizOption)
class QuizOptionAdmin(admin.ModelAdmin):
    list_display = ("question", "order", "text", "is_correct")
    list_filter = ("is_correct",)
    search_fields = ("text", "question__question")


@admin.register(QuizSession)
class QuizSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "started_at", "ended_at")
    list_filter = ("status",)
    search_fields = ("user__username",)


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = (
        "session",
        "question",
        "option",
        "is_correct",
        "score",
        "answered_at",
    )
    list_filter = ("is_correct",)
    search_fields = ("session__user__username", "question__question")
