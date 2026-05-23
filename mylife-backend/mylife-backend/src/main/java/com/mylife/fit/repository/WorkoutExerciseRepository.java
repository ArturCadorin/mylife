package com.mylife.fit.repository;

import com.mylife.fit.domain.entity.Workout;
import com.mylife.fit.domain.entity.WorkoutExercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, Long> {
    List<WorkoutExercise> findByWorkoutOrderByExerciseOrderAsc(Workout workout);
}
