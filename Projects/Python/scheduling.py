#CSE30, Assignment 11
#Framework created 6/16/20
#Updated 6/18/21

#Used replit instead.
#Find code at https://replit.com/@DanielleLaganie/Scheduling

from collections import defaultdict
import matplotlib.pyplot as plt
import random

#Dependency Scheduler Class
class DependencyScheduler(object):
    def __init__(self):
        self.tasks = set()
        # The successors of a task are the tasks that depend on it, and can
        # only be done once the task is completed.
        self.successors = defaultdict(set)
        # The predecessors of a task have to be done before the task.
        self.predecessors = defaultdict(set)
        self.completed_tasks = set() # completed tasks
        
    def add_task(self, t, dependencies):
        """Adds a task t with given dependencies."""
        # Makes sure we know about all tasks mentioned.
        self.tasks.add(t)
        self.tasks.update(dependencies)
        # The predecessors are the tasks that need to be done before. 
        self.predecessors[t] = set(dependencies)
        # The new task is a successor of its dependencies. 
        for u in dependencies:
            self.successors[u].add(t)

    def reset(self):
        self.completed_tasks = set()
        
    @property
    def done(self):
        return self.completed_tasks == self.tasks
    
    @property
    def available_tasks(self):
        """Returns the set of tasks that can be done in parallel.
        A task can be done if all its predecessors have been completed.
        And of course, we don't return any task that has already been
        completed."""
        # It's just too nice to be able to do this with a one-liner. 
        return ({t for t in self.tasks 
                 if self.predecessors[t].issubset(self.completed_tasks)}
                - self.completed_tasks)
        
    def mark_completed(self, t):
        """Marks the task t as completed, and returns the additional 
        set of tasks that can be done (and that could not be 
        previously done) once t is completed."""
        self.completed_tasks.add(t)
        return {u for u in self.successors[t] 
                if self.predecessors[u].issubset(self.completed_tasks)}

    @property
    def uncompleted(self):
        """Returns the tasks that have not been completed.
        This is a property, so you can say scheduler.uncompleted rather than
        scheduler.uncompleted()"""
        return self.tasks - self.completed_tasks
    
    def _check(self):
        """We check that if t is a successor of u, then u is a predecessor 
        of t."""
        for u in self.tasks:
            for t in self.successors[u]:
                assert u in self.predecessors[t]
    
    def dependency_scheduler_mark_completed(self, t):
        """Marks the task t as completed, and returns the additional 
        set of tasks that can be done (and that could not be 
        previously done) once t is completed."""
        for i in self.predecessors[t]:
            if i in self.uncompleted:
                raise IllegalCompletion(t)
            
        self.completed_tasks.add(t)
        return {u for u in self.successors[t] 
            if self.predecessors[u].issubset(self.completed_tasks)}

    def redo(self, t):
        """Mark the task t, and all its successors, as undone.
        Returns the set of successor tasks of t, with t included."""
        #Adding to return set
        returnset = {t}
        for i in self.successors[t]:
            returnset.add(i)
        #Removing from completed 
        self.completed_tasks = self.completed_tasks - returnset
        return(returnset)




#Checks that `mark_completed` does not mark completed a task whose prerequisites are not all done
class IllegalCompletion(Exception):    
    def __init__(self, t):
        self.message = "Not all prerequisited for", t, "have been completed"


class RunSchedule(object):
    def __init__(self, scheduler):
        self.scheduler = scheduler
        self.in_process = None # Indicating, we don't know yet.
        
    def reset(self):
        self.scheduler.reset()
        self.in_process = None
        
    def step(self):
        """Performs a step, returning the task, if any, or None, 
        if there is no step that can be done."""
        # If we don't know what steps are in process, we get them.
        if self.in_process is None:
            self.in_process = self.scheduler.available_tasks
        if len(self.in_process) == 0:
            return None
        t = random.choice(list(self.in_process))
        self.in_process = self.in_process - {t} | self.scheduler.mark_completed(t)
        return t
    
    @property
    def done(self):
        return self.scheduler.done
    
    def run(self):
        """Runs the scheduler from the current configuration to completion.
        You must call reset() first, if you want to run the whole schedule."""
        tasks = []
        while not self.done:
            t = self.step()
            if t is not None:
                tasks.append(t)
        return tasks
    
    def redo(self, t):
        """Marks t as to be redone."""
        # We drop everything that was in progress.
        # This also forces us to ask the scheduler for what to redo.
        self.in_process = None
        return self.scheduler.redo(t)



#Test Case
s = DependencyScheduler()
s.add_task('a', ['b', 'c'])
s.add_task('b', ['c', 'e'])
print("uncompleted", s.uncompleted)
print("avaliable tasks", s.available_tasks)
print("marked completed", s.mark_completed('c'))
print("marked completed", s.mark_completed('b'))
print("successors", s.successors['c'])
s._check()

s = DependencyScheduler()
s.add_task('a', [])
s.add_task('b', ['a'])
s.add_task('c', ['a'])
s.add_task('d', ['b', 'c'])
s.add_task('e', ['a', 'd'])

s.mark_completed('a')
s.mark_completed('b')
raised = False
try:
    s.mark_completed('d')
except IllegalCompletion:
    raised = True
print(raised)


s = DependencyScheduler()
s.add_task('a', [])
s.add_task('b', ['a'])
s.add_task('c', ['a'])
s.add_task('d', ['b', 'c'])
s.add_task('e', ['a', 'd'])

s.mark_completed('a')
s.mark_completed('b')
s.mark_completed('c')
print(s.available_tasks)
print({'d'})
print()
s.redo('b')
print(s.available_tasks)
print({'b'})

