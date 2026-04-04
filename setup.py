from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

setup(
    name="pathfinder",
    version="0.0.1",
    description="Visual field-path navigator for Frappe",
    author="NCE",
    author_email="",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
