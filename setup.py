from setuptools import find_packages, setup

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

with open("README.md") as f:
    long_description = f.read()

setup(
    name="pathfinder",
    version="0.0.1",
    description="Visual field-path navigator for Frappe — create virtual fields by traversing DocType link chains",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="NCE",
    author_email="dev@nce.dev",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
    python_requires=">=3.10",
)
